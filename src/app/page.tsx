import Image from "next/image";
import React from "react";

export const metadata = {
  title: `Oscar Watson-Smith`,
  description: `Hey I'm Oscar. I've spent the better half of a decade working at the nexus between
          product, engineering and sales to build and sell brilliant software at
          companies such as Datadog & Vanta`,
  keywords: [
    "Oscar",
    "Watson-Smith",
    "Software Engineering",
    "Product",
    "Engineering",
    "Sales",
    "Seles Engineering",
  ],
};

export default function Home() {
  return (
    <div className="flex flex-col items-center h-screen">
      <div className="max-w-2xl gap-6 flex items-center flex-col mt-8 sm:mt-24 text-center px-4">
        <h1 className="text-2xl text-center ">{`👋 Hey, I'm Oscar`}</h1>
        <div className="flex flex-col items-center gap-1">
          <Image
            src="/me.jpg"
            alt="Oscar"
            height={216}
            width={216}
            className="w-54 h-54 rounded-2xl bg-cover bg-center object-cover shadow-md transition-transform duration-300 ease-in-out hover:scale-101"
          />
          <span className="text-xs text-gray-500 pt-1">
            {`(me talking very enthusiastically about security)`}
          </span>
        </div>
        <h2 className="text-xl ">
          {`I've spent the better half of a decade working at the nexus between
          product, engineering and sales to build and sell brilliant software at
          companies such as`}
          <Tile
            logoSrc="/ra.jpeg"
            altText="RA"
            rotation={3}
            bgColor="#ff4849"
            externalLink="https://www.ra.co"
          />
          <Tile
            logoSrc="/kablamo.jpeg"
            altText="Vanta"
            rotation={-3}
            bgColor="#292929"
            externalLink="https://www.kablamo.com.au"
          />
          <Tile
            logoSrc="/linktree.png"
            altText="Linktree"
            rotation={4}
            bgColor="#44e861"
            externalLink="https://linktr.ee"
          />
          <Tile
            logoSrc="/datadog.svg"
            altText="Datadog"
            rotation={5}
            externalLink="https://www.datadoghq.com"
          />
          <Tile
            logoSrc="/vanta.svg"
            altText="Vanta"
            rotation={-2}
            externalLink="https://www.vanta.com"
          />
        </h2>
        <h2 className="text-xl">
          {`I also help developers improve their soft-skills in order to better sell themselves and the value of the products they build, over at `}{" "}
          <span className="block">
            <a href="https://convincingcode.com" className="text-blue-500 ">
              {`Convincing Code`}
            </a>
          </span>
        </h2>

        {/* <h2 className="text-xl">
          I also write about how Software Engineers can sharpen their
          soft-skills to advance their careers, or transition into Sales
          Engineering like I did over at
          <a href="https://convincingcode.com" className="text-blue-500">
            {` `} Convincing Code
          </a>
        </h2>
        <h2 className="text-xl">
          You can also find other miscellaneous writings of mine here.
        </h2> */}
      </div>
      <div className="flex items-center text-gray-500 text-sm gap-2 mt-8">
        <a
          href="https://www.linkedin.com/in/oscargws/"
          className="hover:text-gray-700"
        >
          linkedin
        </a>{" "}
        <a href="https://github.com/oscargws" className="hover:text-gray-700">
          github
        </a>
        <a
          href="https://www.instagram.com/oscarg.ws/"
          className="hover:text-gray-700"
        >
          instagram
        </a>
      </div>
    </div>
  );
}

interface TileProps {
  logoSrc: string;
  altText: string;
  rotation?: number;
  bgColor?: string;
  externalLink?: string; // Optional external link
}

const Tile: React.FC<TileProps> = ({
  logoSrc,
  altText,
  rotation = 0,
  bgColor = "white",
  externalLink,
}) => {
  const content = (
    <span
      className="inline-block align-middle rounded-lg mx-1 shadow-md border-1 border-gray-200 transition-transform duration-300 ease-in-out hover:scale-105 hover:-translate-y-1"
      style={{ transform: `rotate(${rotation}deg)`, backgroundColor: bgColor }}
    >
      <div className="w-8 h-8 flex items-center justify-center rounded-md transition-transform duration-300 ease-in-out hover:rotate-6">
        <Image src={logoSrc} alt={altText} width={24} height={24} />
      </div>
    </span>
  );

  return externalLink ? (
    <a href={externalLink} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    content
  );
};
