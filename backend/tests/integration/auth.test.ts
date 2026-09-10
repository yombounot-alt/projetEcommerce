import { app, request, createUser, authHeader } from "../helpers";

describe("Auth", () => {
  describe("POST /api/v1/auth/register", () => {
    it("creates a new customer account and returns a session", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@lumera.test",
        password: "Password1",
      });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe("jane.doe@lumera.test");
      expect(res.body.user.role).toBe("customer");
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("rejects a duplicate email", async () => {
      await request(app).post("/api/v1/auth/register").send({
        firstName: "Jane",
        lastName: "Doe",
        email: "dup@lumera.test",
        password: "Password1",
      });

      const res = await request(app).post("/api/v1/auth/register").send({
        firstName: "Jane",
        lastName: "Doe",
        email: "dup@lumera.test",
        password: "Password1",
      });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("EMAIL_TAKEN");
    });

    it("rejects a weak password", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        firstName: "Jane",
        lastName: "Doe",
        email: "weak@lumera.test",
        password: "short",
      });

      expect(res.status).toBe(422);
      expect(res.body.fieldErrors).toBeDefined();
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("logs in with correct credentials", async () => {
      const { user } = await createUser("customer", { email: "login@lumera.test" });
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: user.email, password: "Password1" });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
    });

    it("rejects an incorrect password", async () => {
      const { user } = await createUser("customer", { email: "wrongpass@lumera.test" });
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: user.email, password: "WrongPassword1" });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("Session lifecycle", () => {
    it("refreshes and then revokes a session via logout", async () => {
      const { user } = await createUser("customer", { email: "refresh@lumera.test" });
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: user.email, password: "Password1" });

      const cookies = loginRes.headers["set-cookie"];
      expect(cookies).toBeDefined();

      const refreshRes = await request(app).post("/api/v1/auth/refresh").set("Cookie", cookies);
      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.accessToken).toEqual(expect.any(String));

      const newCookies = refreshRes.headers["set-cookie"];
      const logoutRes = await request(app).post("/api/v1/auth/logout").set("Cookie", newCookies);
      expect(logoutRes.status).toBe(204);

      // The rotated-out old refresh token must be rejected (single-use rotation).
      const reuseRes = await request(app).post("/api/v1/auth/refresh").set("Cookie", cookies);
      expect(reuseRes.status).toBe(401);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("rejects unauthenticated access", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns the current user profile when authenticated", async () => {
      const { user, accessToken } = await createUser("customer", { email: "me@lumera.test" });
      const res = await request(app).get("/api/v1/auth/me").set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(user.email);
    });
  });
});
