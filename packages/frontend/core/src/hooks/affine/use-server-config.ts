import { serverConfigQuery } from '@affine/graphql';
import { useQueryImmutable } from '@affine/workspace/affine/gql';
import type { BareFetcher, Middleware } from 'swr';

const wrappedFetcher = (fetcher: BareFetcher<any> | null, ...args: any[]) =>
  fetcher?.(...args).catch(() => null);

const errorHandler: Middleware = useSWRNext => (key, fetcher, config) => {
  return useSWRNext(key, wrappedFetcher.bind(null, fetcher), config);
};

const useServerConfig = () => {
  const { data: config, error } = useQueryImmutable(
    { query: serverConfigQuery },
    {
      use: [errorHandler],
    }
  );

  if (error || !config) {
    return null;
  }

  return config.serverConfig;
};

export const useServerFlavor = () => {
  const config = useServerConfig();

  if (!config) {
    return 'local';
  }

  return config.flavor;
};

export const useSelfHosted = () => {
  const serverFlavor = useServerFlavor();

  return ['local', 'selfhosted'].includes(serverFlavor);
};

export const useServerBaseUrl = () => {
  const config = useServerConfig();

  if (!config) {
    if (environment.isDesktop) {
      // don't use window.location in electron
      return null;
    }
    const { protocol, hostname, port } = window.location;
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }

  return config.baseUrl;
};
