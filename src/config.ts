
export function buildConfig(config: Record<string, string>) {
  if (!config.MERCURY_KEY) {
    throw new Error('ENV configuration invalid - missing MERCURY_KEY')
  }

  if (!config.MERCURY_URL) {
    throw new Error('ENV configuration invalid - missing MERCURY_URL')
  }

  return {
    mercuryKey: config.MERCURY_KEY,
    mercuryUrl: config.MERCURY_URL
  }
}

export type Conf = ReturnType<typeof buildConfig>