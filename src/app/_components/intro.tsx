import Image from 'next/image'

const logo = "/assets/stories-to-amaze-no-text.jpg";

export function Intro() {
  return (
    <section className="flex-col md:flex-row flex items-center md:justify-between mt-16 mb-16 md:mb-12">
      <div className="flex items-center">
        <Image
          src={logo}
          alt="Logo"
          width={64}
          height={64}
          className="mr-4"
        />
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight md:pr-8">
          Stories to Amaze
        </h1>
      </div>
      <h4 className="text-center md:text-left text-lg mt-5 md:pl-8">
        Amazing stories with everyday goods.
      </h4>
    </section>
  );
}
