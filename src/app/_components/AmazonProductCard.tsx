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
      className="group block max-w-lg border rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 
        dark:border-gray-700 dark:hover:border-gray-600
        border-gray-200 hover:border-gray-300
        shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]
        dark:shadow-[0_2px_15px_-3px_rgba(0,0,0,0.2),0_10px_20px_-2px_rgba(0,0,0,0.1)]
        hover:shadow-[0_8px_17px_-4px_rgba(0,0,0,0.1),0_16px_24px_-2px_rgba(0,0,0,0.05)]
        dark:hover:shadow-[0_8px_17px_-4px_rgba(0,0,0,0.3),0_16px_24px_-2px_rgba(0,0,0,0.2)]"
    >
      <div className="flex">
        <div className="relative w-24 flex-shrink-0">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-2">{title}</h3>
          <div className="flex items-center gap-2">
            <p className="text-purple-300 font-semibold">{price}</p>
            <span className="text-gray-600 dark:text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">
              Shop on Amazon →
            </span>
          </div>
        </div>
      </div>
    </a>
  );
} 