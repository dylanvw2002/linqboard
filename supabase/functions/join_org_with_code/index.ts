import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Authorization header:', req.headers.get('Authorization') ? 'present' : 'missing')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
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
