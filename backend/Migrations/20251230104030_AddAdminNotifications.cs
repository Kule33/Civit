using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:notification_type", "suspicious,refund,normal");

            migrationBuilder.CreateTable(
                name: "admin_notifications",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    type = table.Column<int>(type: "notification_type", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    read = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    metadata = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    link = table.Column<string>(type: "varchar", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_admin_notifications", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "admin_notifications");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:Enum:notification_type", "suspicious,refund,normal");
        }
    }
}
