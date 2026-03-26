import prisma from "@/lib/prisma"

export const defaultFilesDocCategories = [
  "Policy",
  "Schedule",
  "Contacts",
  "Maps",
  "Reports",
  "General",
]

export async function ensureDefaultFilesDocCategories() {
  const existingCount = await prisma.filesDocCategory.count()

  if (existingCount > 0) {
    return
  }

  await prisma.filesDocCategory.createMany({
    data: defaultFilesDocCategories.map((name) => ({ name })),
    skipDuplicates: true,
  })
}
