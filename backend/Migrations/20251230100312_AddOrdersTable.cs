using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddOrdersTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // This migration may be applied to databases where "UserProfiles"."Balance" already exists.
            // Using IF NOT EXISTS prevents the migration from failing and allows the Orders table to be created.
            migrationBuilder.Sql(
                "ALTER TABLE \"UserProfiles\" ADD COLUMN IF NOT EXISTS \"Balance\" numeric(18,2) NOT NULL DEFAULT 0;");

            migrationBuilder.CreateTable(
                name: "Orders",
                columns: table => new
                {
                    OrderId = table.Column<string>(type: "text", nullable: false),
                    PaperId = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => new { x.OrderId, x.PaperId });
                });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CreatedAt",
                table: "Orders",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_UserId",
                table: "Orders",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Orders");

            migrationBuilder.Sql(
                "ALTER TABLE \"UserProfiles\" DROP COLUMN IF EXISTS \"Balance\";");
        }
    }
}
