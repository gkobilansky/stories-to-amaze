import Container from "@/app/_components/container";
import { REPO_PATH } from "@/lib/constants";
import Image from "next/image";

const logo = "/assets/stories-to-amaze-no-text.jpg";

export function Footer() {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-200 dark:bg-slate-800">
      <Container>
        <div className="py-28 flex flex-col lg:flex-row items-center">
          <div className="flex items-center lg:w-1/2">
            <Image
              src={logo}
              alt="Stories to Amaze Logo"
              width={50}
              height={50}
              className="mr-4"
            />
            <p className="text-2xl font-bold tracking-tighter leading-tight text-center lg:text-left mb-10 lg:mb-0 lg:pr-4">
              All product links are Amazon affiliate links.
            </p>
          </div>
          <div className="flex flex-col lg:flex-row justify-center items-center lg:pl-4 lg:w-1/2">
            <a
              href="https://www.amazon.com/shop/flowathletics"
              className="mx-3 bg-black hover:bg-white hover:text-black border border-black text-white font-bold py-3 px-12 lg:px-8 duration-200 transition-colors mb-6 lg:mb-0"
            >
              Visit Our Store
            </a>
            <a
              href={`https://github.com/gkobilansky/${REPO_PATH}`}
              className="mx-3 font-bold hover:underline"
            >
              Source code on GitHub
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
