/**
 * The `IModel` interface represents a model with methods for converting
 * the model to a string representation and for populating the model
 * from an object.
 */
export interface IModel {
    /**
     * Converts the model to its string representation.
     *
     * @returns A string representing the model.
     */
    toString(): string;
  
    /**
     * Populates the model from the provided object.
     *
     * @param obj - An object containing data to populate the model with.
     */
    fromObject(obj: any): void;
  }