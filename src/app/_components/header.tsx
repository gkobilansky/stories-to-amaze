import Link from "next/link";
import Image from "next/image";

const logo = "/assets/stories-to-amaze-no-text.jpg";

const Header = () => {
  return (
    <div className="flex items-left mt-2 lg:w-1/2 h-full">
      <Image
        src={logo}
        alt="Stories to Amaze Logo"
        width={48}
        height={48}
        className="mr-4"
      />
      <h2 className="text-2xl md:text-4xl font-bold tracking-tight md:tracking-tighter leading-tight flex items-center">
        <Link href="/" className="hover:underline">
          Stories to Amaze
        </Link>
      </h2>
    </div>
  );
};

export default Header;
