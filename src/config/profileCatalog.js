export const HEAVY_PROFILES = Object.freeze(['load', 'stress', 'spike', 'soak', 'endurance', 'breakpoint']);

export function isHeavyProfile(profile) {
    return HEAVY_PROFILES.includes(profile);
}
