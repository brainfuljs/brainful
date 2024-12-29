import { injectable } from "inversify"
import { ErrorHandler } from "../../interfaces"

@injectable()
export class ErrorService implements ErrorHandler {
  handle(error: Error): void {
    console.log(error)
  }
}
