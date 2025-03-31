export type Author = {
  id: 'alex' | 'jack';
  name: string;
  position: string;
  avatar: string;
  link: string;
  linkyUsername: string;
  linkyLink: string;
};

export const authors: Author[] = [
  {
    id: 'alex',
    name: 'Alex',
    position: 'Founder',
    avatar:
      'https://cdn.lin.ky/block-f5a2d44d-6933-4a51-a9e2-9fbb27923585/f4fdd080-46be-483f-9b04-e5646efb157d',
    link: 'https://x.com/alexjpate',
    linkyUsername: 'alex',
    linkyLink: 'https://alex.now',
  },
  {
    id: 'jack',
    name: 'Jack',
    position: 'Co-founder',
    avatar:
      'https://cdn.lin.ky/666b7445-c171-4ad7-a21d-eb1954b7bd40/0885d7ec-9af4-4430-94f4-ad1a033c2704',
    link: 'https://x.com/trylinky',
    linkyUsername: 'jack',
    linkyLink: 'https://lin.ky/jack',
  },
];
