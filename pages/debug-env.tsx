import { useEffect, useState } from 'react';
import { Box, Container, Heading, Text, VStack, Code, Stack } from '@chakra-ui/react';
import { featureFlags, FeatureFlag } from '@/lib/feature-flags';

export default function DebugEnv() {
  const [envInfo, setEnvInfo] = useState<any>(null);

  useEffect(() => {
    // Get all environment info
    const info = {
      nodeEnv: process.env.NODE_ENV,
      nextPublicVercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
      featureFlagEnvironment: (featureFlags as any).getCurrentEnvironment(),
      chakraHeaderEnabled: featureFlags.isEnabled(FeatureFlag.CHAKRA_HEADER),
      chakraBottomNavEnabled: featureFlags.isEnabled(FeatureFlag.CHAKRA_BOTTOM_NAV),
    };

    setEnvInfo(info);
    console.log('🔍 Environment Debug Info:', info);
  }, []);

  if (!envInfo) {
    return <Text>Loading...</Text>;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Stack gap={6}>
        <Heading>Environment Debug</Heading>

        <Box>
          <Heading size="md" mb={2}>Environment Variables</Heading>
          <Stack gap={2}>
            <Text><strong>NODE_ENV:</strong> <Code>{envInfo.nodeEnv || 'undefined'}</Code></Text>
            <Text><strong>NEXT_PUBLIC_VERCEL_ENV:</strong> <Code>{envInfo.nextPublicVercelEnv || 'undefined'}</Code></Text>
            <Text><strong>Hostname:</strong> <Code>{envInfo.hostname}</Code></Text>
          </Stack>
        </Box>

        <Box>
          <Heading size="md" mb={2}>Feature Flag System</Heading>
          <Stack gap={2}>
            <Text><strong>Detected Environment:</strong> <Code>{envInfo.featureFlagEnvironment}</Code></Text>
            <Text><strong>CHAKRA_HEADER Enabled:</strong> <Code colorPalette={envInfo.chakraHeaderEnabled ? 'green' : 'red'}>{envInfo.chakraHeaderEnabled ? 'TRUE ✅' : 'FALSE ❌'}</Code></Text>
            <Text><strong>CHAKRA_BOTTOM_NAV Enabled:</strong> <Code colorPalette={envInfo.chakraBottomNavEnabled ? 'green' : 'red'}>{envInfo.chakraBottomNavEnabled ? 'TRUE ✅' : 'FALSE ❌'}</Code></Text>
          </Stack>
        </Box>

        <Box>
          <Heading size="md" mb={2}>Console Helpers</Heading>
          <Text>Open browser console and try:</Text>
          <Code as="pre" p={4} borderRadius="md" mt={2}>
{`window.getFeatureFlags()
window.toggleFeatureFlag('CHAKRA_HEADER', true)
window.toggleFeatureFlag('CHAKRA_BOTTOM_NAV', true)`}
          </Code>
        </Box>
      </Stack>
    </Container>
  );
}
