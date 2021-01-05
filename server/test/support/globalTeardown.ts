import sandbox from "@architect/sandbox"

export default async (): Promise<void> => {
  await sandbox.end()
}
