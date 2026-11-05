# Authenticating requests

To authenticate requests, include an **`Authorization`** header with the value **`"Bearer {TOKEN}"`**.

All authenticated endpoints are marked with a `requires authentication` badge in the documentation below.

Dapatkan token dari endpoint <b>POST /api/v1/auth/login</b> atau <b>/auth/register</b>, lalu kirim sebagai header <code>Authorization: Bearer {TOKEN}</code>.
