import { configApiRef, useApi } from '@backstage/frontend-plugin-api';
import { ProxiedSignInPage, SignInPage } from '@backstage/core-components';
import type { SignInPageProps } from '@backstage/plugin-app-react';

export function SignInPageSwitch(props: SignInPageProps) {
  const config = useApi(configApiRef);
  const provider = config.getOptionalString('app.signInPage.provider');

  if (provider) {
    return <ProxiedSignInPage {...props} provider={provider} />;
  }

  return <SignInPage {...props} providers={['guest']} />;
}
