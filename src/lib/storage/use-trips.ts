"use client"

import { useSyncExternalStore } from "react"

import {
  getTrips,
  TRIPS_CHANGED_EVENT,
} from "@/lib/storage/trips"

import type { Trip } from "@/lib/expenses/types"

const EMPTY_TRIPS: Trip[] = []

let snapshot: Trip[] = []

function getSnapshot(): Trip[] {
  const trips = getTrips()

  if (
    JSON.stringify(snapshot) !==
    JSON.stringify(trips)
  ) {
    snapshot = trips
  }

  return snapshot
}

function getServerSnapshot(): Trip[] {
  return EMPTY_TRIPS
}

function subscribe(
  callback: () => void,
) {
  function handleChange() {
    snapshot = getTrips()
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

export function useTrips(): Trip[] {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )
}
