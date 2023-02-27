import { useState } from "react"

class LocalStorageStatefulField<T> {
    readonly localStorageKey: string
    readonly defaultValue: T
    readonly initialValueProducer: (localStorageInput: string)  => T
    readonly currentStatefulValue: T
    readonly updateFunction: React.Dispatch<React.SetStateAction<T>>

    constructor(
        localStorageKey: string,
        defaultValue: T,
        initialValueProducer: (localStorageInput: string) => T) {

        this.localStorageKey = localStorageKey
        this.defaultValue = defaultValue
        this.initialValueProducer = initialValueProducer

        const localStorageValue = localStorage.getItem(localStorageKey) 

        const initialValue : T = localStorageValue !== null 
            ? this.initialValueProducer(localStorageValue) 
            : this.defaultValue 

        const [value, updateFunction] = useState(initialValue)

        this.currentStatefulValue = value;
        this.updateFunction = updateFunction;
    }

    readonly reset : () => void = () => {
        localStorage.removeItem(this.localStorageKey)
        this.updateFunction(this.defaultValue)
    }

    readonly updateSavingToLocalStorageFunction : () => React.Dispatch<React.SetStateAction<T>> = 
        () => {
            return data => {
                localStorage.setItem(this.localStorageKey, String(data))
                return this.updateFunction(data)
            }
        }
}

export default LocalStorageStatefulField;