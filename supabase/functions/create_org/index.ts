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

    const { organizationName } = await req.json()

    if (!organizationName || organizationName.trim() === '') {
      throw new Error('Organization name is required')
    }

    console.log('Creating organization:', { organizationName, userId: user.id })

    // Check organization limit
    const { data: canCreate, error: limitError } = await supabaseClient
      .rpc('check_organization_limit', { _user_id: user.id })

    if (limitError) {
      console.error('Error checking organization limit:', limitError)
      throw limitError
    }

    if (!canCreate) {
      console.log('User has reached organization limit')
      return new Response(
        JSON.stringify({ error: 'Organization limit reached. Please upgrade your plan.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      )
    }

    // Generate invite code
    const { data: inviteCodeData, error: codeError } = await supabaseClient
      .rpc('generate_invite_code')

    if (codeError) {
      console.error('Error generating invite code:', codeError)
      throw codeError
    }

    const inviteCode = inviteCodeData

    console.log('Generated invite code:', inviteCode)

    // Create organization
    const { data: org, error: orgError } = await supabaseClient
      .from('organizations')
      .insert({
        name: organizationName.trim(),
        invite_code: inviteCode,
      })
      .select()
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      throw orgError
    }

    console.log('Created organization:', org)

    // Create membership (owner)
    const { error: memberError } = await supabaseClient
      .from('memberships')
      .insert({
        user_id: user.id,
        organization_id: org.id,
        role: 'owner',
      })

    if (memberError) {
      console.error('Error creating membership:', memberError)
      throw memberError
    }

    console.log('Created owner membership')

    // Create default board
    const { data: board, error: boardError } = await supabaseClient
      .from('boards')
      .insert({
        organization_id: org.id,
        name: 'Hoofd Board',
        background_image_url: 'default',
        background_fit_mode: 'cover',
        background_scale: 100,
        background_position_x: 50,
        background_position_y: 50,
      })
      .select()
      .single()

    if (boardError) {
      console.error('Error creating board:', boardError)
      throw boardError
    }

    console.log('Created default board:', board)

    // Create default columns
    const defaultColumns = [
      { name: 'Vandaag', position: 0 },
      { name: 'Deze week', position: 1 },
      { name: 'Ziek', position: 2 },
      { name: 'Afgerond', position: 3 },
      { name: 'Verlof', position: 4 },
      { name: 'Belangrijke informatie', position: 5 },
    ]

    const columnsToInsert = defaultColumns.map((col) => ({
      board_id: board.id,
      name: col.name,
      position: col.position,
    }))

    const { error: columnsError } = await supabaseClient
      .from('columns')
      .insert(columnsToInsert)

    if (columnsError) {
      console.error('Error creating columns:', columnsError)
      throw columnsError
    }

    console.log('Created default columns')

    return new Response(
      JSON.stringify({
        success: true,
        organization: org,
        board: board,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in create_org:', error)
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
