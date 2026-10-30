export class TripAccessError extends Error {
  constructor(message = "No tienes acceso a este sustito") {
    super(message)
    this.name = "TripAccessError"
  }
}
