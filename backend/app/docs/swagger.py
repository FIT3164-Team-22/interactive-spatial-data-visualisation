swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "Interactive Weather API",
        "description": "API documentation for the BOM Weather Visualization platform.",
        "version": "1.0.0",
    },
    "basePath": "/api/v1",
    "schemes": ["http", "https"],
}

swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/api/v1/spec",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/docs",
}
