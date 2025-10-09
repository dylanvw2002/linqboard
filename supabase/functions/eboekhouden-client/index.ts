import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EBOEKHOUDEN_API_TOKEN = Deno.env.get('EBOEKHOUDEN_API_TOKEN')
const EBOEKHOUDEN_API_URL = 'https://api.e-boekhouden.nl'

// Validate API token on startup
if (!EBOEKHOUDEN_API_TOKEN || EBOEKHOUDEN_API_TOKEN.trim() === '') {
  console.error('Missing e-Boekhouden API token')
} else {
  console.log('E-Boekhouden API token loaded successfully')
}

interface AddRelatieParams {
  relatiecode: string
  bedrijf: string
  email: string
  land: string
  btwNummer?: string
}

interface AddFactuurParams {
  relatiecode: string
  factuurnummer: string
  factuurdatum: string
  bedragExclBtw: number
  btwCode: string
  omschrijving: string
  intervalText: string
  planName: string
}

// Session token cache
let sessionToken: string | null = null
let sessionExpiry: number = 0

async function getSessionToken(): Promise<string> {
  // Check if we have a valid cached session
  if (sessionToken !== null && Date.now() < sessionExpiry) {
    console.log('Using cached session token')
    return sessionToken
  }

  console.log('Creating new e-Boekhouden session')
  
  if (!EBOEKHOUDEN_API_TOKEN || EBOEKHOUDEN_API_TOKEN.trim() === '') {
    throw new Error('E-boekhouden API token is not configured')
  }
  
  const response = await fetch(`${EBOEKHOUDEN_API_URL}/v1/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessToken: EBOEKHOUDEN_API_TOKEN,
      source: 'LinqBoard'
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Session creation failed:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    })
    throw new Error(`Failed to create e-Boekhouden session: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  sessionToken = data.sessionToken
  // Session tokens typically last 15 minutes, we'll refresh after 10
  sessionExpiry = Date.now() + (10 * 60 * 1000)
  
  console.log('E-boekhouden session created successfully')
  return data.sessionToken
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!EBOEKHOUDEN_API_TOKEN) {
      throw new Error('E-boekhouden API token not configured')
    }

    const { action, params } = await req.json()
    console.log('E-boekhouden action:', action, params)

    let result
    switch (action) {
      case 'addRelatie':
        result = await addRelatie(params)
        break
      case 'addFactuur':
        result = await addFactuur(params)
        break
      case 'getRelatie':
        result = await getRelatie(params.relatiecode)
        break
      default:
        throw new Error('Unknown action: ' + action)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error: any) {
    console.error('E-boekhouden error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

async function getRelatie(relatiecode: string) {
  const token = await getSessionToken()
  
  const response = await fetch(
    `${EBOEKHOUDEN_API_URL}/v1/relation?code=${encodeURIComponent(relatiecode)}`,
    {
      headers: {
        'X-Session-Token': token,
        'Content-Type': 'application/json',
      }
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('GetRelatie failed:', response.status, errorText)
    throw new Error(`Failed to get relation: ${response.status}`)
  }

  const data = await response.json()
  const exists = data.results && data.results.length > 0
  
  console.log('Relation check:', { relatiecode, exists })
  return { exists, relatiecode }
}

async function addRelatie(params: AddRelatieParams) {
  const token = await getSessionToken()
  
  const relationData = {
    type: 'B', // B = Bedrijf (business), P = Privé (private)
    code: params.relatiecode,
    companyName: params.bedrijf,
    email: params.email,
    country: params.land,
    ...(params.btwNummer && { vatNumber: params.btwNummer })
  }

  console.log('Creating relation:', relationData)

  const response = await fetch(`${EBOEKHOUDEN_API_URL}/v1/relation`, {
    method: 'POST',
    headers: {
      'X-Session-Token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(relationData)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('AddRelatie failed:', response.status, errorText)
    
    // Try to parse error details
    try {
      const errorData = JSON.parse(errorText)
      throw new Error(`E-boekhouden error: ${errorData.title || errorData.message || 'Unknown error'}`)
    } catch {
      throw new Error(`Failed to create relation: ${response.status}`)
    }
  }

  const data = await response.json()
  console.log('Relation created:', data)
  
  return { success: true, relatiecode: params.relatiecode, relationId: data.id }
}

async function addFactuur(params: AddFactuurParams) {
  const token = await getSessionToken()
  
  const relationResponse = await fetch(
    `${EBOEKHOUDEN_API_URL}/v1/relation?code=${encodeURIComponent(params.relatiecode)}`,
    {
      headers: {
        'X-Session-Token': token,
        'Content-Type': 'application/json',
      }
    }
  )

  if (!relationResponse.ok) {
    throw new Error('Failed to find relation for invoice')
  }

  const relationData = await relationResponse.json()
  if (!relationData.results || relationData.results.length === 0) {
    throw new Error('Relation not found')
  }

  const relationId = relationData.results[0].id

  const invoiceData = {
    relationId: relationId,
    invoiceNumber: params.factuurnummer,
    date: params.factuurdatum,
    termOfPayment: 14,
    items: [
      {
        quantity: 1,
        unit: params.intervalText === 'Maandelijks' ? 'maand' : 'jaar',
        code: `LINQ-${params.planName}`,
        description: `LinqBoard ${params.planName} Abonnement (${params.intervalText})`,
        priceExcl: params.bedragExclBtw,
        vatCode: params.btwCode,
        ledgerId: 8000 // Revenue account
      }
    ]
  }

  console.log('Creating invoice:', invoiceData)

  const response = await fetch(`${EBOEKHOUDEN_API_URL}/v1/invoice`, {
    method: 'POST',
    headers: {
      'X-Session-Token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(invoiceData)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('AddFactuur failed:', response.status, errorText)
    
    try {
      const errorData = JSON.parse(errorText)
      throw new Error(`E-boekhouden error: ${errorData.title || errorData.message || 'Unknown error'}`)
    } catch {
      throw new Error(`Failed to create invoice: ${response.status}`)
    }
  }

  const data = await response.json()
  console.log('Invoice created:', data)
  
  return { 
    success: true, 
    factuurnummer: params.factuurnummer,
    invoiceId: data.id
  }
}

// Helper function to determine BTW code based on country and customer type
export function getBtwCode(country: string, customerType: string, vatNumberValid: boolean): string {
  // Netherlands - always 21%
  if (country === 'NL') {
    return 'HOOG_VERK_21'
  }
  
  // EU Business with valid VAT - reverse charge
  const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']
  
  if (euCountries.includes(country) && customerType === 'business' && vatNumberValid) {
    return 'VERLEGD'
  }
  
  // EU Private customers - 21% (OSS threshold check should be done separately)
  if (euCountries.includes(country) && customerType === 'private') {
    return 'HOOG_VERK_21'
  }
  
  // Outside EU - no VAT
  return 'GEEN'
}
