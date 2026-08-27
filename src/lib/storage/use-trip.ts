"use client"

import { useSyncExternalStore } from "react"

import {
  getTrip,
  TRIPS_CHANGED_EVENT,
} from "@/lib/storage/trips"

import type { Trip } from "@/lib/expenses/types"


const snapshots = new Map<
  string,
  Trip | null
>()


function subscribe(
  callback: () => void,
) {
  window.addEventListener(
    TRIPS_CHANGED_EVENT,
    callback,
  )

  window.addEventListener(
    "storage",
    callback,
  )

  return () => {
    window.removeEventListener(
      TRIPS_CHANGED_EVENT,
      callback,
    )

    window.removeEventListener(
      "storage",
      callback,
    )
  }
}


function getSnapshot(
  tripId: string | null,
): Trip | null {
  if (!tripId) {
    return null
  }

  if (!snapshots.has(tripId)) {
    snapshots.set(
      tripId,
      getTrip(tripId),
    )
  }

  return snapshots.get(tripId) ?? null
}


function getServerSnapshot(): Trip | null {
  return null
}


export function useTrip(
  tripId: string | null,
): Trip | null {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot(tripId),
    getServerSnapshot,
  )
}
