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
  function handleChange() {
    // Invalidamos los snapshots anteriores.
    snapshots.clear()

    callback()
  }

  window.addEventListener(
    TRIPS_CHANGED_EVENT,
    handleChange,
  )

  window.addEventListener(
    "storage",
    handleChange,
  )

  return () => {
    window.removeEventListener(
      TRIPS_CHANGED_EVENT,
      handleChange,
    )

    window.removeEventListener(
      "storage",
      handleChange,
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

const SERVER_SNAPSHOT: Trip | null = null

function getServerSnapshot(): Trip | null {
  return SERVER_SNAPSHOT
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
