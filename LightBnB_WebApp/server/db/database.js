const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  const queryString = `SELECT * FROM users WHERE email = $1`

  return pool.query(queryString, [email])
    .then(res => res.rows[0])

}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  const queryString = `SELECT * FROM users WHERE id = $1`
  return pool.query(queryString, [id])
    .then(res => res.rows[0])
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {

  const queryString = `INSERT INTO users(name, email, password) VALUEs ($1, $2, $3) RETURNING *;`
  const values = [user.name, user.email, user.password]
  return pool.query(queryString, values)
    .then(res => res.rows[0])
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */

const getAllReservations = function (guest_id, limit = 10) {
  const values = [guest_id, limit];

  const queryString = `SELECT properties.*, reservations.*, AVG(rating) as average_rating
  FROM properties
  JOIN property_reviews 
  ON property_reviews.property_id = properties.id
  JOIN reservations 
  ON reservations.property_id = properties.id
  WHERE reservations.guest_id = $1
  AND end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY start_date
  LIMIT $2;`


  return pool.query(queryString, values)
    .then(res => res.rows)
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  let queryString = `SELECT properties.*, AVG(rating) as average_rating
  FROM properties
  JOIN property_reviews 
  ON property_reviews.property_id = properties.id
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`); // [city]
    queryString += `WHERE city LIKE $${queryParams.length} `;

    if (options.owner_id) {
      queryParams.push(`${options.owner_id}`);
      queryString += ` AND owner_id = $${queryParams.length} `;
    }
  } else if (options.owner_id) {
    queryParams.push(`${options.owner_id}`); // [city]
    queryString += `WHERE owner_id = $${queryParams.length} `;
  }

  queryString += `GROUP BY properties.id
  `;

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `HAVING AVG(rating) > $${queryParams.length}`;

    if (options.minimum_price_per_night) {
      queryParams.push(options.minimum_price_per_night);
      queryString += ` AND cost_per_night > $${queryParams.length}`;

      if (options.maximum_price_per_night) {
        queryParams.push(options.maximum_price_per_night);
        queryString += ` AND cost_per_night < $${queryParams.length}`;
      }
    } else { // min rating but no min price
      if (options.maximum_price_per_night) {
        queryParams.push(options.maximum_price_per_night);
        queryString += ` AND cost_per_night < $${queryParams.length}`;
      }
    }

  } else { // no min rating
    if (options.minimum_price_per_night) {
      queryParams.push(options.minimum_price_per_night);
      queryString += `HAVING cost_per_night > $${queryParams.length}`;

      if (options.maximum_price_per_night) {
        queryParams.push(options.maximum_price_per_night);
        queryString += ` AND cost_per_night < $${queryParams.length}`;
      }
    } else { // no min rating no min price
      if (options.maximum_price_per_night) {
        queryParams.push(options.maximum_price_per_night);
        queryString += `HAVING cost_per_night < $${queryParams.length}`;
      }
    }
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
  // console.log(queryParams, queryString)
  return pool.query(queryString, queryParams)
    .then(res => res.rows)

}

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {

  const queryString = `
  INSERT INTO properties
  (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;
  `;

  const queryParams = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms,
    property.country,
    property.street,
    property.city,
    property.province,
    property.post_code,
  ];


  return pool
    .query(queryString, queryParams)
    .then((res) => res.rows)
    .catch((err) => console.error("query error", err.stack));
};
exports.addProperty = addProperty;


  // const propertyId = Object.keys(properties).length + 1;
  // property.id = propertyId;
  // properties[propertyId] = property;
  // return Promise.resolve(property);


