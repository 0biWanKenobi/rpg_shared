const subtle = crypto.subtle;
export const sc_deriveKey = subtle.deriveKey.bind(subtle);
export const sc_importKey = subtle.importKey.bind(subtle);
export const sc_encrypt = subtle.encrypt.bind(subtle);
export const sc_decrypt = subtle.decrypt.bind(subtle);
export const sc_digest = subtle.digest.bind(subtle);
export const sc_randUUID = crypto.randomUUID.bind(crypto);
export const sc_randValues = crypto.getRandomValues.bind(crypto);