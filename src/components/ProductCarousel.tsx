import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Props {
  images: string[];
  alt: string;
}

export function ProductCarousel({ images, alt }: Props) {
  if (images.length === 1) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-muted">
        <img
          src={images[0]}
          alt={alt}
          className="aspect-square w-full object-cover"
        />
      </div>
    );
  }
  return (
    <Carousel className="w-full">
      <CarouselContent>
        {images.map((src, i) => (
          <CarouselItem key={i}>
            <div className="overflow-hidden rounded-2xl border border-border bg-muted">
              <img
                src={src}
                alt={`${alt} — view ${i + 1}`}
                className="aspect-square w-full object-cover"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-3" />
      <CarouselNext className="right-3" />
    </Carousel>
  );
}
