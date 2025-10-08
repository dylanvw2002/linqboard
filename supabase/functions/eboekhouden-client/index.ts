import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EBOEKHOUDEN_USERNAME = Deno.env.get('EBOEKHOUDEN_USERNAME')
const EBOEKHOUDEN_SECURITY_CODE1 = Deno.env.get('EBOEKHOUDEN_SECURITY_CODE1')
const EBOEKHOUDEN_SECURITY_CODE2 = Deno.env.get('EBOEKHOUDEN_SECURITY_CODE2')
const SOAP_ENDPOINT = 'https://soap.e-boekhouden.nl/soap.asmx'

// Validate credentials on startup with detailed logging
if (!EBOEKHOUDEN_USERNAME || !EBOEKHOUDEN_SECURITY_CODE1 || !EBOEKHOUDEN_SECURITY_CODE2) {
  console.error('Missing e-Boekhouden credentials:', {
    hasUsername: !!EBOEKHOUDEN_USERNAME,
    usernameLength: EBOEKHOUDEN_USERNAME?.length || 0,
    hasSecurityCode1: !!EBOEKHOUDEN_SECURITY_CODE1,
    code1Length: EBOEKHOUDEN_SECURITY_CODE1?.length || 0,
    hasSecurityCode2: !!EBOEKHOUDEN_SECURITY_CODE2,
    code2Length: EBOEKHOUDEN_SECURITY_CODE2?.length || 0
  })
} else {
  console.log('E-Boekhouden credentials loaded:', {
    username: EBOEKHOUDEN_USERNAME,
    code1Length: EBOEKHOUDEN_SECURITY_CODE1.length,
    code2Length: EBOEKHOUDEN_SECURITY_CODE2.length
  })
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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

async function soapRequest(action: string, body: string) {
  // Check credentials before making request with detailed validation
  if (!EBOEKHOUDEN_USERNAME || EBOEKHOUDEN_USERNAME.trim() === '') {
    throw new Error('E-boekhouden USERNAME not configured or empty')
  }
  if (!EBOEKHOUDEN_SECURITY_CODE1 || EBOEKHOUDEN_SECURITY_CODE1.trim() === '') {
    throw new Error('E-boekhouden SECURITY_CODE1 not configured or empty')
  }
  if (!EBOEKHOUDEN_SECURITY_CODE2 || EBOEKHOUDEN_SECURITY_CODE2.trim() === '') {
    throw new Error('E-boekhouden SECURITY_CODE2 not configured or empty')
  }

  const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${action} xmlns="http://www.e-boekhouden.nl/soap">
      <Username>${EBOEKHOUDEN_USERNAME}</Username>
      <SecurityCode1>${EBOEKHOUDEN_SECURITY_CODE1}</SecurityCode1>
      <SecurityCode2>${EBOEKHOUDEN_SECURITY_CODE2}</SecurityCode2>
      ${body}
    </${action}>
  </soap:Body>
</soap:Envelope>`

  console.log('SOAP Request:', action)
  console.log('SOAP Envelope (masked):', envelope.replace(/<SecurityCode\d>[^<]+/g, '<SecurityCodeX>***'))
  
  const response = await fetch(SOAP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': `http://www.e-boekhouden.nl/soap/${action}`
    },
    body: envelope
  })

  const responseText = await response.text()
  console.log('SOAP Response status:', response.status)
  
  if (!response.ok) {
    console.error('SOAP Error Response:', responseText)
    throw new Error(`SOAP request failed: ${response.status}`)
  }

  return responseText
}

async function addRelatie(params: AddRelatieParams) {
  const body = `
    <oRel>
      <Relatiecode>${params.relatiecode}</Relatiecode>
      <Bedrijf>${escapeXml(params.bedrijf)}</Bedrijf>
      <Email>${params.email}</Email>
      <Land>${params.land}</Land>
      ${params.btwNummer ? `<BTWNummer>${params.btwNummer}</BTWNummer>` : ''}
    </oRel>
  `

  const response = await soapRequest('AddRelatie', body)
  
  // Parse response
  if (response.includes('<ErrorMsg>')) {
    const errorMatch = response.match(/<ErrorMsg[^>]*>([^<]+)<\/ErrorMsg>/)
    if (errorMatch && errorMatch[1] !== 'OK') {
      throw new Error(`E-boekhouden error: ${errorMatch[1]}`)
    }
  }

  return { success: true, relatiecode: params.relatiecode }
}

async function getRelatie(relatiecode: string) {
  const body = `
    <cFilter>
      <Zoekterm>${relatiecode}</Zoekterm>
    </cFilter>
  `

  const response = await soapRequest('GetRelaties', body)
  
  // Check if relation exists
  const exists = response.includes(`<Code>${relatiecode}</Code>`)
  
  return { exists, relatiecode }
}

async function addFactuur(params: AddFactuurParams) {
  const body = `
    <oFact>
      <Relatiecode>${params.relatiecode}</Relatiecode>
      <Factuurnummer>${params.factuurnummer}</Factuurnummer>
      <Datum>${params.factuurdatum}</Datum>
      <Regels>
        <cFactuurRegel>
          <Aantal>1</Aantal>
          <Eenheid>${params.intervalText === 'Maandelijks' ? 'maand' : 'jaar'}</Eenheid>
          <Code>LINQ-${params.planName}</Code>
          <Omschrijving>LinqBoard ${params.planName} Abonnement (${params.intervalText})</Omschrijving>
          <PrijsPerEenheid>${params.bedragExclBtw.toFixed(2)}</PrijsPerEenheid>
          <BTWCode>${params.btwCode}</BTWCode>
          <TegenrekeningCode>8000</TegenrekeningCode>
        </cFactuurRegel>
      </Regels>
    </oFact>
  `

  const response = await soapRequest('AddFactuur', body)
  
  // Parse response for factuurnummer
  if (response.includes('<ErrorMsg>')) {
    const errorMatch = response.match(/<ErrorMsg[^>]*>([^<]+)<\/ErrorMsg>/)
    if (errorMatch && errorMatch[1] !== 'OK') {
      throw new Error(`E-boekhouden error: ${errorMatch[1]}`)
    }
  }

  const factuurMatch = response.match(/<Factuurnummer[^>]*>([^<]+)<\/Factuurnummer>/)
  
  return { 
    success: true, 
    factuurnummer: factuurMatch ? factuurMatch[1] : params.factuurnummer,
    response: response
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
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