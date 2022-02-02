export const env = {
  optional: (name: string): string | undefined => {
    return process.env[name]
  },
  required: (name: string): string => {
    const value = env.optional(name)
    if (!value) throw new Error(`The environment variable "${name}" is required for deployment.`)
    return value
  },
  integer: (name: string, defaultValue: number): number => {
    const value = env.optional(name)
    if (!value) return defaultValue
    const parsed = parseInt(value)
    if (parsed === NaN) return defaultValue
    return parsed
  }
}
