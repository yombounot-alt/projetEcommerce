import { app, request, createUser, authHeader } from "../helpers";
import * as userService from "../../src/services/user.service";

describe("Admin user role management", () => {
  it("lets an admin promote a customer to seller", async () => {
    const admin = await createUser("admin");
    const customer = await createUser("customer");

    const res = await request(app)
      .patch(`/api/v1/users/${customer.user._id}/role`)
      .set(authHeader(admin.accessToken))
      .send({ role: "seller" });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("seller");
  });

  it("rejects role changes from a non-admin", async () => {
    const customer = await createUser("customer");
    const target = await createUser("customer", { email: "target@lumera.test" });

    const res = await request(app)
      .patch(`/api/v1/users/${target.user._id}/role`)
      .set(authHeader(customer.accessToken))
      .send({ role: "seller" });

    expect(res.status).toBe(403);
  });

  it("prevents an admin from demoting themselves (via the real HTTP route)", async () => {
    const admin = await createUser("admin");

    const res = await request(app)
      .patch(`/api/v1/users/${admin.user._id}/role`)
      .set(authHeader(admin.accessToken))
      .send({ role: "customer" });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("CANNOT_SELF_DEMOTE");
  });

  it("allows demoting an admin when another admin remains", async () => {
    const admin1 = await createUser("admin", { email: "admin1@lumera.test" });
    const admin2 = await createUser("admin", { email: "admin2@lumera.test" });

    const updated = await userService.updateUserRole(
      String(admin2.user._id),
      "seller",
      String(admin1.user._id),
    );

    expect(updated.role).toBe("seller");
  });

  it("prevents a different admin from demoting the sole remaining admin", async () => {
    const soleAdmin = await createUser("admin", { email: "sole@lumera.test" });
    const actingAdmin = await createUser("admin", { email: "acting@lumera.test" });

    // Demote actingAdmin first (allowed: soleAdmin is still around) so soleAdmin becomes
    // the only admin left in the system.
    await userService.updateUserRole(
      String(actingAdmin.user._id),
      "seller",
      String(soleAdmin.user._id),
    );

    // A distinct actor (actingAdmin, now a seller, but we call the service directly to
    // isolate the business rule from route-level role authorization) tries to demote the
    // now-sole admin.
    await expect(
      userService.updateUserRole(
        String(soleAdmin.user._id),
        "customer",
        String(actingAdmin.user._id),
      ),
    ).rejects.toMatchObject({ code: "LAST_ADMIN_PROTECTED" });

    const stillAdmin = await userService.getUserById(String(soleAdmin.user._id));
    expect(stillAdmin.role).toBe("admin");
  });

  it("prevents self-demotion even when it would also be the last admin", async () => {
    const soleAdmin = await createUser("admin", { email: "sole-self@lumera.test" });

    await expect(
      userService.updateUserRole(
        String(soleAdmin.user._id),
        "customer",
        String(soleAdmin.user._id),
      ),
    ).rejects.toMatchObject({ code: "CANNOT_SELF_DEMOTE" });
  });
});
