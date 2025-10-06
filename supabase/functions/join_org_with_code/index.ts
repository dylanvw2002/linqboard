import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Extract JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    console.log('Authorization header:', authHeader ? 'present' : 'missing')
    
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the JWT token and get user
    const {
      data: { user },
      error: authError
    } = await supabaseClient.auth.getUser(token)

    console.log('Auth response:', { user: user ? 'present' : 'null', error: authError })

    if (authError) {
      console.error('Authentication error:', authError)
      throw new Error(`Authentication failed: ${authError.message}`)
    }

    if (!user) {
      console.error('No user returned from getUser()')
      throw new Error('User not authenticated')
    }

    const { inviteCode } = await req.json()

    if (!inviteCode || inviteCode.trim() === '') {
      throw new Error('Invite code is required')
    }

    console.log('Joining organization with code:', { inviteCode: inviteCode.toUpperCase(), userId: user.id })

    // Find organization by invite code
    const { data: org, error: orgError } = await supabaseClient
      .from('organizations')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()

    if (orgError || !org) {
      console.error('Organization not found:', orgError)
      throw new Error('Ongeldige uitnodigingscode')
    }

    console.log('Found organization:', org)

    // Check if user is already a member
    const { data: existingMembership } = await supabaseClient
      .from('memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', org.id)
      .single()

    if (existingMembership) {
      console.log('User already a member')
      return new Response(
        JSON.stringify({
          success: true,
          organization: org,
          message: 'Je bent al lid van deze organisatie',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Check member limit for the organization
    const { data: canJoin, error: limitError } = await supabaseClient
      .rpc('check_member_limit', { _org_id: org.id })

    if (limitError) {
      console.error('Error checking member limit:', limitError)
      throw limitError
    }

    if (!canJoin) {
      console.log('Organization has reached member limit')
      return new Response(
        JSON.stringify({ error: 'Organization has reached its member limit. Owner needs to upgrade.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      )
    }

    // Create membership
    const { error: memberError } = await supabaseClient
      .from('memberships')
      .insert({
        user_id: user.id,
        organization_id: org.id,
        role: 'member',
      })

    if (memberError) {
      console.error('Error creating membership:', memberError)
      throw memberError
    }

    console.log('Created membership')

    return new Response(
      JSON.stringify({
        success: true,
        organization: org,
        message: 'Succesvol lid geworden van de organisatie',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in join_org_with_code:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
