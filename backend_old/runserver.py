import os
import peerpear
import argparse


PORT = 5000


def main():

    parser = argparse.ArgumentParser(description="Run Flasp app")
    parser.add_argument("--production",
                        action="store_true",
                        help="Run in production mode (disables debug)")
    args = parser.parse_args()
    
    peerpear.app.debug = not args.production
    if os.environ.get("FLASK_ENV") in ["production", "prod"]:
        peerpear.app.debug = False

    peerpear.app.run(host='0.0.0.0', port=PORT)


if __name__ == '__main__':
    main()
