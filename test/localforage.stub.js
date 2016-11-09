function Store({ storeName }) {
    this.storeName = storeName;
    this.store = {};
}

Store.prototype.setItem = async function setItem(key, data) {
    this.store[key] = data;
    return await Promise.resolve();
};

Store.prototype.getItem = async function getItem(key) {
    return await Promise.resolve(this.store[key] || null);
};

Store.prototype.removeItem = async function removeItem(key) {
    delete this.store[key];
    return await Promise.resolve();
};

function createInstance({ storeName, name, description, driver }) {
    return new Store({ storeName, name, description, driver });
}
export default {
    createInstance
}