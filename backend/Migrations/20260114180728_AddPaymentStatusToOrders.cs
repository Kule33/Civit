using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using backend.Models;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentStatusToOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Safely create enum if it doesn't exist
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
                        CREATE TYPE notification_type AS ENUM ('suspicious', 'refund', 'normal');
                    END IF;
                END
                $$;");

            migrationBuilder.AddColumn<Guid>(
                name: "QuestionId1",
                table: "Typesets",
                type: "uuid",
                nullable: true);

            // Removed because table "admin_notifications" already exists
            /*
            migrationBuilder.CreateTable(
                name: "admin_notifications",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    type = table.Column<AdminNotificationType>(type: "notification_type", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    read = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    metadata = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    link = table.Column<string>(type: "varchar", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_admin_notifications", x => x.id);
                });
            */

            // Removed "Orders" table creation because it exists.
            // Adding "PaymentStatus" column instead.
            /*
            migrationBuilder.CreateTable(
                name: "Orders",
                columns: table => new
                {
                    OrderId = table.Column<string>(type: "text", nullable: false),
                    PaperId = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    PaymentStatus = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => new { x.OrderId, x.PaperId });
                });
            */
            
            // Add column to existing table
            migrationBuilder.AddColumn<string>(
                name: "PaymentStatus",
                table: "Orders",
                type: "text",
                nullable: false,
                defaultValue: "pending");

            migrationBuilder.CreateIndex(
                name: "IX_Typesets_QuestionId1",
                table: "Typesets",
                column: "QuestionId1");

            /*
            migrationBuilder.CreateIndex(
                name: "IX_Orders_CreatedAt",
                table: "Orders",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_UserId",
                table: "Orders",
                column: "UserId");
            */

            migrationBuilder.AddForeignKey(
                name: "FK_Typesets_Questions_QuestionId1",
                table: "Typesets",
                column: "QuestionId1",
                principalTable: "Questions",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Typesets_Questions_QuestionId1",
                table: "Typesets");

            migrationBuilder.DropTable(
                name: "admin_notifications");

            migrationBuilder.DropTable(
                name: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Typesets_QuestionId1",
                table: "Typesets");

            migrationBuilder.DropColumn(
                name: "QuestionId1",
                table: "Typesets");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:Enum:notification_type", "suspicious,refund,normal");
        }
    }
}
