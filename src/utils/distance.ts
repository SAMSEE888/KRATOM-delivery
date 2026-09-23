/**
 * Haversine formula to calculate straight-line distance between two coordinates in km
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  // Return distance rounded to 2 decimal places (minimum 0.1 km)
  return Math.max(0.1, Math.round(distance * 100) / 100);
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export interface DeliveryCalculation {
  distanceKm: number;
  shippingFee: number;
  baseFee: number;
  extraFee: number;
  baseDistanceKm: number;
  feePerExtraKm: number;
}

export function calculateDeliveryFee(
  distanceKm: number,
  baseFee: number = 10,
  baseDistanceKm: number = 1,
  feePerExtraKm: number = 10
): DeliveryCalculation {
  if (distanceKm <= baseDistanceKm) {
    return {
      distanceKm,
      shippingFee: baseFee,
      baseFee,
      extraFee: 0,
      baseDistanceKm,
      feePerExtraKm,
    };
  }
  
  const extraDistance = Math.ceil(distanceKm - baseDistanceKm);
  const extraFee = extraDistance * feePerExtraKm;
  const totalFee = baseFee + extraFee;
  
  return {
    distanceKm,
    shippingFee: totalFee,
    baseFee,
    extraFee,
    baseDistanceKm,
    feePerExtraKm,
  };
}
