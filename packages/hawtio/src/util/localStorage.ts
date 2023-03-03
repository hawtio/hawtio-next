import { STORAGE_KEY_CONNECTIONS, STORAGE_KEY_CURRENT_CONNECTION } from "@hawtiosrc/plugins/connect/connect-service";
import { STORAGE_KEY_JOLOKIA_OPTIONS, STORAGE_KEY_UPDATE_RATE } from "@hawtiosrc/plugins/connect/jolokia-service";
import { string } from "superstruct";

export function saveToLocalStorage(storageKey: string, value: any) {
    localStorage.setItem(storageKey, String(value))
}

export function retrieveValueFromLocalStorage(storagekey: string) : string | null {
    return localStorage.getItem(storagekey)
}

export function resetLocalStorage() {
    //Use this function to reset preferences. Some preferences of the local storage shouldn't
    //be resetted. Add their fields to the list below so they can be backup and 
    //restored into the local storage.

    const LOCAL_STORAGE_FIELDS_TO_PRESERVE = [
        STORAGE_KEY_JOLOKIA_OPTIONS,
        STORAGE_KEY_UPDATE_RATE,
        STORAGE_KEY_CONNECTIONS,
        STORAGE_KEY_CURRENT_CONNECTION
    ]

    const backupFields = LOCAL_STORAGE_FIELDS_TO_PRESERVE.map(
        key => [key, localStorage.getItem(key)]
    )

    localStorage.clear();

    backupFields.forEach(
        (key, value) => localStorage.setItem(key, value)
    )

    //TODO: reload page on reset on connection preferences

}