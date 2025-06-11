"use client";

import React from 'react';
import Image from 'next/image';

const LogoCloud: React.FC = () => {
  const companies = [
    {
      name: 'Figma',
      logo: '/figma.svg',
      url: 'https://figma.com',
      role: 'Enterprise Solutions Consultant'
    },
    {
      name: 'Vanta',
      logo: '/vanta.svg',
      url: 'https://www.vanta.com',
      role: 'Sales Engineer'
    },
    {
      name: 'Datadog',
      logo: '/datadog.svg',
      url: 'https://www.datadoghq.com',
      role: 'Sales Engineer'
    },
    {
      name: 'Brighte',
      logo: '/brighte.svg',
      url: 'https://www.brighte.com.au',
      role: 'Senior Frontend Engineer'
    },
    {
      name: 'Linktree',
      logo: '/linktree.svg',
      url: 'https://www.linktr.ee',
      role: 'Frontend Engineer'
    },
    {
      name: 'Kablamo',
      logo: '/kablamo.png',
      url: 'https://www.kablamo.com.au',
      role: 'Frontend Engineer'
    },
    {
      name: 'RA',
      logo: '/ra.png',
      url: 'https://www.ra.co',
      role: 'Software Engineer'
    },
  ];

  const rotations = [2, -3, 1, -2, 3, 1, -1]; // Different rotation for each card

  return (
    <div className="max-w-xl w-full px-4 mt-8 flex justify-start">
      <div 
        className="relative flex items-center group cursor-pointer"
        onMouseEnter={() => {
          const cards = document.querySelectorAll('.logo-card');
          cards.forEach((card, index) => {
            const rotationChange = index === 0 ? -2 : 2; // Figma (index 0) rotates opposite direction
            (card as HTMLElement).style.transform = `translateX(${index * 2}px) rotate(${rotations[index] + rotationChange}deg)`;
          });
        }}
        onMouseLeave={() => {
          const cards = document.querySelectorAll('.logo-card');
          cards.forEach((card, index) => {
            (card as HTMLElement).style.transform = `translateX(${index * -20}px) rotate(${rotations[index]}deg)`;
          });
        }}
      >
        {companies.map((company, index) => (
          <a
            key={company.name}
            href={company.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`logo-card relative transition-all duration-500 ease-out rounded-md border border-zinc-200 shadow-sm hover:shadow-md w-12 h-12 flex items-center justify-center ${company.name === 'Brighte' || company.name === 'Linktree' ? 'p-2' : ''}`}
            style={{
              transform: `translateX(${index * -24}px) rotate(${rotations[index]}deg)`,
              zIndex: companies.length - index,
              backgroundColor: 
                company.name === 'Brighte' 
                  ? '#00C28C'
                  : company.name === 'Linktree'
                  ? '#44e660'
                  : 'white',
            }}
          >
            <Image
              src={company.logo}
              alt={`${company.name} logo`}
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
              style={
                company.name === 'Brighte' 
                  ? { filter: 'brightness(0) invert(1)' } // White icon
                  : company.name === 'Linktree'
                  ? { filter: 'brightness(0)' } // Black icon
                  : {}
              }
            />
          </a>
        ))}
      </div>
    </div>
  );
};

export default LogoCloud;