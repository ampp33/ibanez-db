import { Guitar } from '../../domain/entities/Guitar';
import { GuitarImage } from '../../domain/entities/GuitarImage';
import type { StorageAdapter } from '../storage/storage.interface';
import type { GuitarDto, GuitarDetailDto, GuitarImageDto } from '@ibanez-db/shared';

export class GuitarDtoMapper {
  constructor(private readonly storage: StorageAdapter) {}

  toDto(guitar: Guitar): GuitarDto {
    const primaryImage = guitar.images.getItems().find((img) => img.isPrimary);
    const firstImage = guitar.images.getItems()[0];
    const displayImage = primaryImage ?? firstImage;

    return {
      id: guitar.id,
      model: guitar.model,
      name: guitar.name,
      slug: guitar.slug,
      productCategory: guitar.productCategory,
      series: guitar.series,
      bodyType: guitar.bodyType,
      bodyMaterial: guitar.bodyMaterial,
      bodyMaterialList: guitar.bodyMaterialList ?? [],
      neckType: guitar.neckType,
      neckMaterial: guitar.neckMaterial,
      neckMaterialList: guitar.neckMaterialList ?? [],
      fretboardMaterial: guitar.fretboardMaterial,
      fretboardMaterialList: guitar.fretboardMaterialList ?? [],
      fretboardRadius: guitar.fretboardRadius,
      numberOfFrets: guitar.numberOfFrets,
      numberOfFretsList: guitar.numberOfFretsList ?? [],
      numberOfStrings: guitar.numberOfStrings,
      scaleLength: guitar.scaleLength,
      pickupConfiguration: guitar.pickupConfiguration,
      pickupConfigurationList: guitar.pickupConfigurationList ?? [],
      neckPickup: guitar.neckPickup,
      middlePickup: guitar.middlePickup,
      bridgePickup: guitar.bridgePickup,
      bridgeType: guitar.bridgeType,
      tremolo: guitar.tremolo,
      hardwareColor: guitar.hardwareColor,
      finishes: guitar.finishes ?? [],
      countryOfOrigin: guitar.countryOfOrigin,
      countryOfOriginList: guitar.countryOfOriginList ?? [],
      yearsProduced: guitar.yearsProduced,
      productionStart: guitar.productionStart,
      productionEnd: guitar.productionEnd,
      msrp: guitar.msrp,
      wikiUrl: guitar.wikiUrl,
      primaryImageUrl: displayImage
        ? this.storage.getPublicUrl(displayImage.storageKey)
        : null,
      createdAt: guitar.createdAt.toISOString(),
      updatedAt: guitar.updatedAt.toISOString(),
    };
  }

  toDetailDto(guitar: Guitar, resolvedDescriptionHtml: string | null): GuitarDetailDto {
    return {
      ...this.toDto(guitar),
      images: guitar.images.getItems().map((img) => this.toImageDto(img)),
      descriptionHtml: resolvedDescriptionHtml,
      rawAttributes: guitar.rawAttributes ?? {},
    };
  }

  toImageDto(image: GuitarImage): GuitarImageDto {
    return {
      id: image.id,
      guitarId: image.guitar.id,
      storageKey: image.storageKey,
      originalName: image.originalName,
      sizeBytes: image.sizeBytes,
      mimeType: image.mimeType,
      isPrimary: image.isPrimary,
      url: this.storage.getPublicUrl(image.storageKey),
      createdAt: image.createdAt.toISOString(),
    };
  }
}
