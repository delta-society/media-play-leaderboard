export interface Member {
  id: string;
  name: string;
  displayName: string;
  avatar: string;
  t1Channel: string;
  ghostBlogId?: string;
}

export const MEMBERS: Member[] = [
  {
    id: "sung",
    name: "Sung",
    displayName: "성중",
    avatar: "/avatars/sung.png",
    t1Channel: "blog",
    ghostBlogId: "thefuturemundane",
  },
  {
    id: "woong",
    name: "Woong",
    displayName: "웅",
    avatar: "/avatars/woong.png",
    t1Channel: "blog",
  },
  {
    id: "zoon",
    name: "Zoon",
    displayName: "준",
    avatar: "/avatars/zoon.png",
    t1Channel: "podcast",
    ghostBlogId: "re-builder",
  },
];

export function getMember(id: string): Member | undefined {
  return MEMBERS.find((m) => m.id === id);
}
