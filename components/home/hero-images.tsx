import { ChevronDown, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { images } from "@/lib/images";

export const HeroImages = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2 sm:px-4">
      <div className="col-span-1 sm:col-span-2 grid grid-rows-2 gap-4">
        <div className="row-span-1">
          <div className="relative h-full">
            <Image
              width={100}
              height={100}
              src={images.air.src}
              alt={images.air.alt}
              className="w-full h-[420px] object-cover rounded"
              priority
            />
            <Link
              href="#"
              className="absolute flex flex-row items-center bottom-4 left-4 bg-white text-primary px-4 py-2 rounded-3xl shadow hover:translate-y-1 hover:text-primary hover:bg-slate-200 transition-all"
            >
              Learn More{" "}
              <ChevronDown
                size={24}
                className="text-white w-5 h-5 ml-1 rounded-full bg-primary"
              />
            </Link>
          </div>
        </div>

        <div className="row-span-1 grid grid-cols-2 gap-4">
          <div className="relative h-full">
            <Image
              width={100}
              height={100}
              src={images.air2.src}
              alt={images.air2.alt}
              className="w-full h-full object-cover rounded"
            />
            <Link
              href="#"
              className="absolute bottom-4 right-4 bg-white text-primary px-4 py-2 rounded-3xl shadow hover:bg-slate-200 transition-all"
            >
              #Awash_Bank
            </Link>
          </div>

          <div className="relative">
            <Image
              width={100}
              height={100}
              src={images.cash.src}
              alt={images.cash.alt}
              className="w-full h-full object-cover rounded"
            />
            <Link
              href="#"
              className="absolute bottom-4 right-4 bg-white text-primary px-4 py-2 rounded-3xl shadow hover:bg-slate-200 transition-all"
            >
              #Dashin_Dube
            </Link>
          </div>
        </div>
      </div>

      <div className="col-span-1 sm:col-span-2">
        <div className="relative h-full">
          <Image
            width={100}
            height={100}
            src={images.car.src}
            alt={images.car.alt}
            className="w-full h-full object-cover rounded"
          />

          <Link
            href="#"
            className="absolute text-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/55 text-white w-16 h-16 flex items-center justify-center rounded-full shadow border-2 border-white hover:scale-125 transition-transform"
          >
            Shop Now
          </Link>

          <div className="absolute bottom-4 right-6 flex gap-1">
            <Link
              href="#"
              className="bg-white text-primary px-4 py-2 rounded-3xl shadow flex flex-row items-center hover:bg-slate-200 transition-all"
            >
              Learn More{" "}
              <ChevronDown
                size={24}
                className="text-white w-5 h-5 ml-1 rounded-full bg-primary"
              />
            </Link>
            <Link
              href="#"
              className="bg-glass-500/65 text-white px-6 py-2 rounded-3xl shadow border-white border-2 flex flex-row items-center hover:bg-glass-600 transition-all"
            >
              Add Product{" "}
              <Plus
                size={24}
                className="text-gray-400 w-5 h-5 ml-1 rounded-full bg-white"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}; 