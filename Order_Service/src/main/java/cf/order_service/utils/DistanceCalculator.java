package cf.order_service.utils;

public class DistanceCalculator {

    private static final int EARTH_RADIUS_KM = 6371; // Rayon moyen de la Terre en kilomètres

    /**
     * Calcule la distance en kilomètres entre deux coordonnées GPS.
     */
    public static double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        // Vérification de sécurité au cas où une adresse n'a pas de coordonnées
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return 0.0;
        }

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        double distance = EARTH_RADIUS_KM * c;

        // Arrondir à 2 chiffres après la virgule
        return Math.round(distance * 100.0) / 100.0;
    }
}
