'use client';

import React from 'react';

interface Testimonial {
  id: number;
  text: string;
  author: string;
  linky: string;
  imageUrl: string;
}

export const testimonialsData: Testimonial[] = [
  {
    id: 1,
    text: 'I love the simplicity of Linky. It is so easy to use, and the platform is very clean and easy to build a link-in-bio on.',
    author: 'Party by Pepper',
    linky: 'lin.ky/partybypepper',
    imageUrl:
      'https://cdn.lin.ky/block-0e587ca1-9482-40e1-8cec-dae2db656279/c802807f-0488-4932-93ab-aa7a0541afea.webp',
  },
  {
    id: 2,
    text: "We've been using linky for our website for a while now, and it's been a great experience. Being able to change the links on the fly is a huge plus.",
    author: 'The Velvet Drone',
    linky: 'lin.ky/velvetdrone',
    imageUrl:
      'https://cdn.lin.ky/block-e23b2867-4335-4d81-b0db-3c18eb8209d5/a93d2d6a-13ef-4938-89b7-e8e8ee1d6c40.webp',
  },
  {
    id: 6,
    text: 'Linky is amazing, exactly what I needed.',
    author: 'Dr. Strauss',
    linky: 'lin.ky/drstrauss',
    imageUrl:
      'https://cdn.lin.ky/block-5e4c15dc-ecae-4bdb-9ab6-ea5e37aa1f14/9349ed51-7e6c-4660-8ffb-06e1c268e638.webp',
  },
  {
    id: 4,
    text: 'As a digital designer, it was essential to find a link-in-bio service that struck the right balance between simplicity & customisation – & Linky delivered perfectly! I really value how their platform complements my aesthetic while giving me the flexibility I need to showcase my work.',
    author: 'de LVCɅ',
    linky: 'lin.ky/delucax99',
    imageUrl:
      'https://cdn.lin.ky/block-7c7149ca-6cc6-4975-be45-94af3eeb8c2f/f7b2b41b-eb7d-47c4-960a-5a21283a9aa4.webp',
  },
  {
    id: 5,
    text: "Linky is the bio page I always wanted. It's clean, modern and looks great! Beats every other bland bio page I've used",
    author: 'Joe',
    linky: 'lin.ky/bis',
    imageUrl:
      'https://cdn.lin.ky/block-176dee6c-daa2-41a5-ac55-495b26c9a6a1/c78b393b-5aa0-4e59-a326-acaee522832d.webp',
  },
  {
    id: 3,
    text: 'I hate having to redeploy my site every time I change a link. Linky solves that: easy changes immediately published',
    author: 'Floffah',
    linky: 'lin.ky/floffah',
    imageUrl:
      'https://cdn.lin.ky/block-9b1c7ebf-d065-4e1c-ba5e-957b63f62851/77778929-5427-445b-b31f-1c666b29ab52.webp',
  },
  {
    id: 7,
    text: "I particularly appreciate Linky's simplicity, its sleek and highly customizable user interface, and the fact that it's open source. The ability to dynamically display information from platforms like Spotify and GitHub is also a fantastic feature.",
    author: 'Abhi',
    linky: 'lin.ky/abhithemodder',
    imageUrl:
      'https://cdn.lin.ky/block-b522cb3a-00b4-41a4-85b9-4bb41d6b694f/6306d168-9be9-411e-a4db-f3c09d664e74.png',
  },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="mb-4 flex w-full break-inside-avoid flex-col items-start justify-start gap-4 rounded-3xl py-6 px-8 border border-neutral-200 bg-white dark:bg-black dark:border-neutral-800">
      <div className="flex w-full select-none items-center justify-start gap-3">
        <img
          alt={testimonial.author}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full ring-1 ring-border ring-offset-2 dark:ring-offset-black"
          src={testimonial.imageUrl}
        />
        <div>
          <p className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
            {testimonial.author}
          </p>
          <p className="text-sm font-normal text-neutral-600 dark:text-neutral-400">
            {testimonial.linky}
          </p>
        </div>
      </div>
      <div
        className="select-none text-[17px] font-normal text-neutral-700 dark:text-neutral-400 text-left"
        style={{ fontVariationSettings: "'SERF' 10, 'wght' 500" }}
      >
        <p>{testimonial.text}</p>
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <>
      {testimonialsData.map((testimonial, idx) => (
        <TestimonialCard
          key={testimonial.id + '-' + idx}
          testimonial={testimonial}
        />
      ))}
    </>
  );
}
