function UnityCacheError(message) {
    this.message = message || '';
}

Object.setPrototypeOf(UnityCacheError.prototype, Error.prototype);
UnityCacheError.prototype.name = 'UnityCacheError';

export default UnityCacheError;
