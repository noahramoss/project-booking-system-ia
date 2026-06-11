-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "image_urls" TEXT[],
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "amenities" TEXT[],
ADD COLUMN     "image_urls" TEXT[],
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" VARCHAR(20);
