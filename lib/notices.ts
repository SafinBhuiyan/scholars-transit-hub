export type NoticeAudienceRole = "USER" | "ADMIN"

export function getUserNoticeWhere(userId: string, role: NoticeAudienceRole) {
  return {
    isPublished: true,
    AND: [
      {
        OR: [
          { target: "ALL" as const },
          {
            AND: [
              { target: "ROLE" as const },
              { targetRoles: { has: role } },
            ],
          },
          {
            AND: [
              { target: "SPECIFIC" as const },
              { targetUsers: { has: userId } },
            ],
          },
        ],
      },
    ],
  }
}
