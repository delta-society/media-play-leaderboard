export interface Member {
  id: string;
  name: string;
  displayName: string;
  avatar: string;
  t1Channel: string;
  teams: string[];
  ghostBlogId?: string;
}

export const MEMBERS: Member[] = [
  {
    id: "sung",
    name: "Sung",
    displayName: "성중",
    avatar: "/avatars/sung.png",
    t1Channel: "blog",
    teams: ["Delta Society", "낭만투자파트너스"],
    ghostBlogId: "thefuturemundane",
  },
  {
    id: "woong",
    name: "Woong",
    displayName: "웅재",
    avatar: "/avatars/woong.png",
    t1Channel: "blog",
    teams: ["Delta Society"],
  },
  {
    id: "zoon",
    name: "Zoon",
    displayName: "원준",
    avatar: "/avatars/zoon.png",
    t1Channel: "podcast",
    teams: ["Delta Society", "낭만투자파트너스"],
    ghostBlogId: "re-builder",
  },
  {
    id: "jae",
    name: "Jae",
    displayName: "재구",
    avatar: "/avatars/jae.png",
    t1Channel: "blog",
    teams: ["낭만투자파트너스"],
  },
  {
    id: "hoon",
    name: "Hoon",
    displayName: "지훈",
    avatar: "/avatars/hoon.png",
    t1Channel: "blog",
    teams: ["낭만투자파트너스"],
  },
];

export function getMember(id: string): Member | undefined {
  return MEMBERS.find((m) => m.id === id);
}
