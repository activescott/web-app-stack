import sandbox from "@architect/sandbox"

export default async (): Promise<void> => {
  // for details on sandbox during local dev and testing tables see "Testing @tables" at https://arc.codes/docs/en/guides/developer-experience/local-development
  await sandbox.start()
}
