package handlers

import "net/http"

func HandleSwaggerRedirect(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/swagger/", http.StatusMovedPermanently)
}

func HandleSwaggerUI(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(`<!doctype html>
<html><head><title>Malas API Swagger</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"></head>
<body><style>.clear-jwt{display:none;margin-right:12px!important;border:1px solid #d9d9d9!important;border-radius:4px!important;background:#fff!important;color:#3b4151!important;font-size:14px!important;padding:6px 12px!important;cursor:pointer}.clear-jwt:hover{background:#f3f3f3!important}</style><button id="clear-jwt" class="clear-jwt" type="button">Clear JWT</button><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script><script>window.onload=()=>{let ui;const clear=document.getElementById('clear-jwt');const place=()=>{const authorize=document.querySelector('.scheme-container .authorize');if(authorize&&!clear.parentNode.classList.contains('scheme-container')){authorize.parentNode.insertBefore(clear,authorize);clear.style.display='inline-block';}};ui=SwaggerUIBundle({url:'/swagger/openapi.json',dom_id:'#swagger-ui',persistAuthorization:true,onComplete:place});clear.onclick=()=>ui.authActions.logout();};</script></body></html>`))
}

func HandleOpenAPI(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write([]byte(openAPISpec))
}

const openAPISpec = `{
  "openapi": "3.0.3",
  "info": {"title": "Malas API", "version": "1.0.0"},
  "servers": [{"url": "/"}],
  "paths": {
    "/recipes": {
      "get": {"summary": "List recipes", "security": [{"jwtAuth": []}], "parameters": [
        {"name": "q", "in": "query", "schema": {"type": "string"}, "description": "Search recipe names"},
        {"name": "page", "in": "query", "schema": {"type": "integer", "minimum": 1, "default": 1}},
        {"name": "page_size", "in": "query", "schema": {"type": "integer", "minimum": 1, "maximum": 50, "default": 20}}
      ], "responses": {"200": {"description": "Recipe page with items and next_page"}, "401": {"description": "Unauthorized"}}}
    },
    "/recipes/{id}": {
      "get": {"summary": "Get a recipe", "parameters": [{"name": "id", "in": "path", "required": true, "schema": {"type": "string"}}], "responses": {"200": {"description": "Recipe"}, "404": {"description": "Not found"}}}
    },
    "/me": {
      "get": {"summary": "Get the current user", "security": [{"jwtAuth": []}], "responses": {"200": {"description": "Current user"}, "401": {"description": "Unauthorized"}}}
    },
    "/auth/user": {
      "get": {"summary": "Get or persist the current user", "security": [{"jwtAuth": []}], "responses": {"200": {"description": "Current user"}, "401": {"description": "Unauthorized"}}}
    },
    "/auth/refresh": {
      "post": {"summary": "Refresh the access token", "parameters": [{"name": "X-Refresh-Token", "in": "header", "required": true, "schema": {"type": "string"}}], "responses": {"200": {"description": "New access token"}, "401": {"description": "Unauthorized"}}}
    },
    "/auth/logout": {
      "post": {"summary": "Log out", "security": [{"jwtAuth": []}], "parameters": [{"name": "X-Refresh-Token", "in": "header", "schema": {"type": "string"}}], "responses": {"200": {"description": "Logged out"}}}
    },
    "/auth/google/login": {
      "get": {"summary": "Start Google sign-in", "responses": {"302": {"description": "Redirect to Google"}}}
    },
    "/auth/apple/login": {
      "get": {"summary": "Start Apple sign-in", "responses": {"302": {"description": "Redirect to Apple"}}}
    },
    "/imports/link": {
      "post": {"summary": "Import a supported social link", "security": [{"jwtAuth": []}], "requestBody": {"required": true, "content": {"application/json": {"schema": {"$ref": "#/components/schemas/LinkImportRequest"}}}}, "responses": {"202": {"description": "Apify run started"}, "400": {"description": "Invalid link"}}}
    },
    "/webhooks/import": {
      "post": {"summary": "Receive an Apify completion webhook", "parameters": [{"name": "X-Webhook-Secret", "in": "header", "required": true, "schema": {"type": "string"}}], "requestBody": {"required": true, "content": {"application/json": {"schema": {"type": "object"}}}}, "responses": {"200": {"description": "Webhook processed"}, "204": {"description": "Unknown source skipped"}}}
    }
  },
  "components": {
    "securitySchemes": {
      "jwtAuth": {"type": "apiKey", "in": "header", "name": "X-JWT", "description": "Paste the JWT value only, without a Bearer prefix."}
    },
    "schemas": {
      "LinkImportRequest": {"type": "object", "required": ["url"], "properties": {"url": {"type": "string", "format": "uri", "example": "https://www.tiktok.com/@cook/video/1234567890123"}}}
    }
  }
}`
