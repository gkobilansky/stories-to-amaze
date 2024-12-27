import Image from 'next/image';

type AmazonProductProps = {
  title: string;
  price: string;
  imageUrl: string;
  productUrl: string;
}

export function AmazonProductCard({ title, price, imageUrl, productUrl }: AmazonProductProps) {
  return (
    <a 
      href={productUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block max-w-lg border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 
        bg-white border-gray-200 hover:border-accent-color
        shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]
        hover:shadow-[0_8px_17px_-4px_rgba(0,0,0,0.1),0_16px_24px_-2px_rgba(0,0,0,0.05)]"
    >
      <div className="flex">
        <div className="relative w-32 flex-shrink-0">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover p-5 transition-transform duration-300 group-hover:scale-105"
            sizes="128px"
          />
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-2 text-primary-color">{title}</h3>
          <div className="flex items-center gap-2">
            <p className="text-secondary-color font-semibold">{price}</p>
            <span className="text-accent-color font-medium opacity-0 transition-opacity group-hover:opacity-100">
              Shop on Amazon →
            </span>
          </div>
        </div>
      </div>
    </a>
  );
} 