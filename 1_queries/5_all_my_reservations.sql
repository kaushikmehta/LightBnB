SELECT properties.*, reservations.*, AVG(rating) as average_rating
FROM properties
JOIN property_reviews 
ON property_reviews.property_id = properties.id
JOIN reservations 
ON reservations.property_id = properties.id
WHERE reservations.guest_id = 1
AND end_date < now()::date
GROUP BY properties.id, reservations.id
ORDER BY start_date
LIMIT 10;