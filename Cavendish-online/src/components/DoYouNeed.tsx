import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { Kicker, Shell } from './ui'

interface Props {
  product: string
  image: string
  imageAlt: string
  paragraphs: ReactNode[]
  callLine?: { label: string; number: string }
}

export default function DoYouNeed({ product, image, imageAlt, paragraphs, callLine }: Props) {
  return (
    <Box component="section" sx={{ py: '44px', bgcolor: '#fff' }}>
      <Shell>
        <Stack direction={{ xs: 'column-reverse', md: 'row' }} spacing={{ xs: 4, md: 8 }} sx={{ alignItems: 'center' }}>
          <Stack sx={{ flex: 1 }}>
            <Kicker>Do you need</Kicker>
            <Typography
              component="h2"
              sx={{
                color: '#191919',
                fontSize: { xs: 26, md: 36 },
                fontWeight: 700,
                letterSpacing: '.71px',
                mb: '20px',
              }}
            >
              {product}
            </Typography>

            {paragraphs.map((p, i) => (
              <Typography
                key={i}
                component="p"
                sx={{ color: '#706f6f', fontSize: 16, lineHeight: '28px', mb: '16px', '& strong': { color: '#191919' } }}
              >
                {p}
              </Typography>
            ))}

            {callLine && (
              <>
                <Typography component="h4" sx={{ color: '#670539', fontSize: 17, fontWeight: 700, mt: '10px', mb: '4px' }}>
                  {callLine.label}
                </Typography>
                <Typography
                  component="h3"
                  sx={{ color: '#840544', fontSize: { xs: 24, md: 28 }, fontWeight: 700, whiteSpace: 'pre-line' }}
                >
                  {callLine.number}
                </Typography>
              </>
            )}
          </Stack>

          <Box sx={{ flexBasis: { md: 400 }, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            <Box component="img" src={image} alt={imageAlt} sx={{ width: '100%', maxWidth: 400, borderRadius: '12px' }} />
          </Box>
        </Stack>
      </Shell>
    </Box>
  )
}

export function LifeInsuranceStrip() {
  return (
    <DoYouNeed
      product="Life Insurance"
      image="/images/5_4_s.jpg"
      imageAlt="Life Insurance featured content box"
      paragraphs={[
        <Fragment key="p1">
          At Cavendish Online, there are a couple of different options to help you find a policy suitable for you/your
          needs. You can either get a quote yourself, which takes just a few minutes of your time; just complete this
          form{' '}
          <Box component="a" href="https://life.cavendishonline.co.uk/life" target="_blank" rel="noopener noreferrer" sx={{ color: '#670539', fontWeight: 700 }}>
            here
          </Box>
          .
        </Fragment>,
        <Fragment key="p2">
          Or, if you want some human interaction, you can speak to one of our specialists over the phone. Our team are
          extremely friendly and will be able to help you find cover tailored to your circumstances for you and your
          loved ones.
        </Fragment>,
        <Fragment key="p3">
          Call us on <strong>01392 241 850</strong> to reach one of our helpful consultants, and tick another task off
          of the ‘to-do’ list!
        </Fragment>,
      ]}
    />
  )
}

export function IncomeProtectionStrip() {
  return (
    <DoYouNeed
      product="Income Protection"
      image="/images/5_5_s.jpg"
      imageAlt="Income Protection Featured Content Box"
      callLine={{ label: 'For more information and to get a quote please call us', number: '03456 44 25 40' }}
      paragraphs={[
        <Fragment key="p1">
          Income Protection is a policy designed to pay a monthly benefit to you to support you if you cannot work
          because you are ill or injured. They do not typically include cover for redundancy (however, there are other
          types of policies that can look at this).
        </Fragment>,
        <Fragment key="p2">
          Income Protection is there to support you in your time of need.
          <br />
          At Cavendish Online, we can help you work out exactly how much income protection insurance you require, and
          what different insurers have to offer.
        </Fragment>,
      ]}
    />
  )
}

export function CriticalIllnessStrip() {
  return (
    <DoYouNeed
      product="Critical Illness"
      image="/images/5_6_s.jpg"
      imageAlt="Critical Illness Featured Content Box"
      callLine={{ label: 'For more information and to get a quote please call us', number: '03456 44 25 40' }}
      paragraphs={[
        <Fragment key="p1">
          While it might not be the nicest thing to think about, the reality is that every single one of us runs the
          risk of falling seriously ill at some point in our lives. We cannot take our health for granted. You only have
          to consider that every 2 minutes in the UK someone is diagnosed with cancer* and every 5 minutes, someone has
          a stroke**
        </Fragment>,
        <Fragment key="p2">
          Having{' '}
          <Box component="a" href="/critical-illness" sx={{ color: '#670539', fontWeight: 700 }}>
            critical illness insurance
          </Box>{' '}
          doesn’t reduce your risk of falling ill, but it does prepare you and your family financially for any bad news
          that may arise. This makes it, in our opinion, one of the most powerful and positive insurance products on the
          market.
        </Fragment>,
        <Box component="span" key="p3" sx={{ fontSize: 12, color: '#aa8094' }}>
          *Cancer Research UK, https://www.cancerresearchuk.org/health-professional/cancer-statistics-for-the-uk ,
          Accessed November 2022
          <br />
          **Stroke Association UK, https://www.stroke.org.uk/what-is-stroke/stroke-statistics , Accessed November 2022
        </Box>,
      ]}
    />
  )
}
